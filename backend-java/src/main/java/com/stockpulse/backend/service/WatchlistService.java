package com.stockpulse.backend.service;

import com.stockpulse.backend.entity.WatchlistGroupEntity;
import com.stockpulse.backend.entity.WatchlistItemEntity;
import com.stockpulse.backend.exception.ApiException;
import com.stockpulse.backend.repository.WatchlistGroupRepository;
import com.stockpulse.backend.repository.WatchlistItemRepository;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class WatchlistService {

    private final WatchlistGroupRepository groupRepository;
    private final WatchlistItemRepository itemRepository;
    private final EntityResponseMapper mapper;

    public WatchlistService(
            WatchlistGroupRepository groupRepository,
            WatchlistItemRepository itemRepository,
            EntityResponseMapper mapper
    ) {
        this.groupRepository = groupRepository;
        this.itemRepository = itemRepository;
        this.mapper = mapper;
    }

    public List<Map<String, Object>> groups(String userId) {
        return groupRepository.findByUserIdOrderByCreatedAtAsc(userId).stream()
                .map(mapper::watchlistGroup)
                .toList();
    }

    public Map<String, Object> createGroup(String userId, String name) {
        WatchlistGroupEntity entity = new WatchlistGroupEntity();
        entity.setUserId(userId);
        entity.setName(name);
        return mapper.watchlistGroup(groupRepository.save(entity));
    }

    public void deleteGroup(String userId, String id) {
        if (!groupRepository.existsByIdAndUserId(id, userId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Group not found");
        }
        groupRepository.deleteByIdAndUserId(id, userId);
    }

    public List<Map<String, Object>> itemsByGroup(String userId, String groupId) {
        return itemRepository.findByGroupIdAndUserIdOrderByCreatedAtAsc(groupId, userId).stream()
                .map(mapper::watchlistItem)
                .toList();
    }

    public List<Map<String, Object>> items(String userId) {
        return itemRepository.findByUserIdOrderByCreatedAtAsc(userId).stream()
                .map(mapper::watchlistItem)
                .toList();
    }

    public Map<String, Object> createItem(String userId, String groupId, String symbol, String name) {
        if (!groupRepository.existsByIdAndUserId(groupId, userId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Group not found");
        }

        WatchlistItemEntity entity = new WatchlistItemEntity();
        entity.setUserId(userId);
        entity.setGroupId(groupId);
        entity.setSymbol(symbol);
        entity.setName(name);
        return mapper.watchlistItem(itemRepository.save(entity));
    }

    public void deleteItem(String userId, String id) {
        if (!itemRepository.existsByIdAndUserId(id, userId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Item not found");
        }
        itemRepository.deleteByIdAndUserId(id, userId);
    }
}
